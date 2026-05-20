import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import geoDataUrl from "./assets/map/nepal-map.geojson?url";
import protectedAreasUrl from "./assets/map/nepal-protected-area.geojson?url";
import { useTheme } from "./themes/ThemeContext.jsx";

const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
};

const normalizeFeatureWinding = (feature) => {
  const geometry = feature.geometry;
  if (!geometry) {
    return feature;
  }

  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates.map((ring) => {
      // Keep polygon exteriors clockwise for this dataset so d3 does not draw complements.
      return ringArea(ring) > 0 ? [...ring].reverse() : ring;
    });

    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: rings,
      },
    };
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates.map((polygon) =>
      polygon.map((ring) => (ringArea(ring) > 0 ? [...ring].reverse() : ring))
    );

    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: polygons,
      },
    };
  }

  return feature;
};

const webMercatorToLonLat = ([x, y]) => {
  const lon = (x / 20037508.34) * 180;
  const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((y / 20037508.34) * Math.PI)) - Math.PI / 2);
  return [lon, lat];
};

const isProjectedCoordinate = ([x, y]) => Math.abs(x) > 180 || Math.abs(y) > 90;

const convertProtectedAreaFeatureToLonLat = (feature) => {
  const geometry = feature.geometry;
  if (!geometry) {
    return feature;
  }

  if (geometry.type === "Polygon") {
    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: geometry.coordinates.map((ring) =>
          ring.map((coord) => (isProjectedCoordinate(coord) ? webMercatorToLonLat(coord) : coord))
        ),
      },
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.map((ring) =>
            ring.map((coord) => (isProjectedCoordinate(coord) ? webMercatorToLonLat(coord) : coord))
          )
        ),
      },
    };
  }

  return feature;
};

const getDistrictInfo = (feature) => {
  const properties = feature.properties ?? {};
  return {
    name: properties.DISTRICT ?? properties.DIST_EN ?? "Unknown District",
    pcode: properties.DIST_PCODE ?? "N/A",
    province: properties.PROVINCE ?? properties.ADM1_EN ?? "N/A",
    hq: properties.HQ ?? "N/A",
  };
};

const getProtectedAreaInfo = (feature) => {
  const properties = feature.properties ?? {};
  return {
    name: properties.name_eng ?? properties.name ?? "Unknown Protected Area",
    nepaliName: properties.name ?? "N/A",
    designation: properties.desig_eng ?? properties.desig ?? "N/A",
    iucnCategory: properties.iucn_cat ?? "N/A",
    areaSqKm: properties.gis_area ?? properties.rep_area ?? "N/A",
    status: properties.status ?? "N/A",
    statusYear: properties.status_yr ?? "N/A",
  };
};

export default function NewMapComponent() {
  const { theme } = useTheme();
  const [districtData, setDistrictData] = useState(null);
  const [protectedAreaData, setProtectedAreaData] = useState(null);
  const [hoveredProtectedArea, setHoveredProtectedArea] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mapContainerRef = useRef(null);
  const frameRef = useRef(null);

  const width = 900;
  const height = 500;

  useEffect(() => {
    let isMounted = true;

    const loadGeoJson = async () => {
      try {
        setLoading(true);
        setError("");
        const [districtResponse, protectedAreaResponse] = await Promise.all([
          fetch(geoDataUrl),
          fetch(protectedAreasUrl),
        ]);

        if (!districtResponse.ok) {
          throw new Error(`Failed to fetch district map data (${districtResponse.status})`);
        }

        if (!protectedAreaResponse.ok) {
          throw new Error(
            `Failed to fetch protected area map data (${protectedAreaResponse.status})`
          );
        }

        const [districtJson, protectedAreaJson] = await Promise.all([
          districtResponse.json(),
          protectedAreaResponse.json(),
        ]);

        if (isMounted) {
          setDistrictData(districtJson);
          setProtectedAreaData(protectedAreaJson);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || "Failed to load map data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGeoJson();

    return () => {
      isMounted = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const projection = useMemo(() => {
    if (!districtData) {
      return null;
    }

    const normalizedData = {
      ...districtData,
      features: districtData.features.map(normalizeFeatureWinding),
    };

    return d3.geoMercator().fitSize([width, height], normalizedData);
  }, [districtData, width, height]);

  const pathGenerator = useMemo(() => {
    if (!projection) {
      return null;
    }

    return d3.geoPath().projection(projection);
  }, [projection]);

  const districts = useMemo(() => {
    if (!districtData || !pathGenerator) {
      return [];
    }

    const normalizedData = {
      ...districtData,
      features: districtData.features.map(normalizeFeatureWinding),
    };

    return normalizedData.features.map((feature, i) => {
      const info = getDistrictInfo(feature);
      return {
        id: `${info.name}-${i}`,
        name: info.name,
        path: pathGenerator(feature),
        info,
      };
    });
  }, [districtData, pathGenerator]);

  const protectedAreas = useMemo(() => {
    if (!protectedAreaData || !pathGenerator) {
      return [];
    }

    const normalizedData = {
      ...protectedAreaData,
      features: protectedAreaData.features
        .map(convertProtectedAreaFeatureToLonLat)
        .map(normalizeFeatureWinding),
    };

    return normalizedData.features.map((feature, i) => {
      const info = getProtectedAreaInfo(feature);
      return {
        id: `${info.name}-${i}`,
        path: pathGenerator(feature),
        info,
      };
    });
  }, [protectedAreaData, pathGenerator]);

  const updateTooltipPosition = (event) => {
    if (!mapContainerRef.current) {
      return;
    }

    const nextX = event.clientX;
    const nextY = event.clientY;

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      const bounds = mapContainerRef.current.getBoundingClientRect();
      setTooltip((prev) => ({
        ...prev,
        x: nextX - bounds.left + 12,
        y: nextY - bounds.top - 18,
      }));
    });
  };

  const handleProtectedAreaMouseEnter = (event, info) => {
    setHoveredProtectedArea(info);
    updateTooltipPosition(event);
    setTooltip((prev) => ({ ...prev, visible: true }));
  };

  const handleProtectedAreaMouseLeave = () => {
    setHoveredProtectedArea(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  if (loading) {
    return <div className="district-panel active">Loading map data...</div>;
  }

  if (error) {
    return <div className="district-panel active">{error}</div>;
  }

  return (
    <div className="map-layout">
      <div className="map-canvas" ref={mapContainerRef}>
        <svg
          className="nepal-map"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {districts.map((district) => {
            return (
              <path
                key={district.id}
                d={district.path}
                className="district-shape"
                fill={theme.colors.secondary}
                stroke={theme.colors.stroke}
                strokeWidth={0.5}
              />
            );
          })}

          {protectedAreas.map((protectedArea) => {
            const isHovered = hoveredProtectedArea?.name === protectedArea.info.name;

            return (
              <path
                key={protectedArea.id}
                d={protectedArea.path}
                className="protected-area-shape"
                fill={isHovered ? theme.colors.primaryHover : theme.colors.primary}
                fillOpacity={isHovered ? 0.9 : 0.7}
                stroke={theme.colors.textPrimary}
                strokeWidth={0.8}
                onMouseEnter={(event) =>
                  handleProtectedAreaMouseEnter(event, protectedArea.info)
                }
                onMouseMove={updateTooltipPosition}
                onMouseLeave={handleProtectedAreaMouseLeave}
              />
            );
          })}
        </svg>

        <div
          className={`map-tooltip ${tooltip.visible ? "visible" : ""}`}
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            backgroundColor: theme.colors.tooltipBg,
            color: theme.colors.tooltipText,
          }}
        >
          <div className="tooltip-title">{hoveredProtectedArea?.name}</div>
          <div className="tooltip-row">
            {hoveredProtectedArea?.designation} | IUCN: {hoveredProtectedArea?.iucnCategory}
          </div>
        </div>
        <div
          className={`district-panel map-info-overlay ${hoveredProtectedArea ? "active" : ""}`}
          style={{
            color: theme.colors.textPrimary,
            boxShadow: "none",
          }}
        >
          <h3 style={{ color: theme.colors.textPrimary }}>Protected Area Info</h3>

          {hoveredProtectedArea ? (
            <div>
              <p>
                <strong>Name:</strong> {hoveredProtectedArea.name}
              </p>
              <p>
                <strong>Nepali Name:</strong> {hoveredProtectedArea.nepaliName}
              </p>
              <p>
                <strong>Designation:</strong> {hoveredProtectedArea.designation}
              </p>
              <p>
                <strong>IUCN Category:</strong> {hoveredProtectedArea.iucnCategory}
              </p>
              <p>
                <strong>Area (sq km):</strong>{" "}
                {typeof hoveredProtectedArea.areaSqKm === "number"
                  ? hoveredProtectedArea.areaSqKm.toFixed(2)
                  : hoveredProtectedArea.areaSqKm}
              </p>
              <p>
                <strong>Status:</strong> {hoveredProtectedArea.status}
              </p>
              <p>
                <strong>Status Year:</strong> {hoveredProtectedArea.statusYear}
              </p>
            </div>
          ) : (
            <p>Hover over a protected area to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
}