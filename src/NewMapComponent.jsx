import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import geoDataUrl from "./assets/map/nepal-map.geojson?url";

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

const getDistrictInfo = (feature) => {
  const properties = feature.properties ?? {};
  return {
    name: properties.DISTRICT ?? properties.DIST_EN ?? "Unknown District",
    pcode: properties.DIST_PCODE ?? "N/A",
    province: properties.PROVINCE ?? properties.ADM1_EN ?? "N/A",
    hq: properties.HQ ?? "N/A",
  };
};

export default function NewMapComponent() {
  const [geoData, setGeoData] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
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
        const response = await fetch(geoDataUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch map data (${response.status})`);
        }

        const data = await response.json();

        if (isMounted) {
          setGeoData(data);
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
    if (!geoData) {
      return null;
    }

    const normalizedData = {
      ...geoData,
      features: geoData.features.map(normalizeFeatureWinding),
    };

    return d3.geoMercator().fitSize([width, height], normalizedData);
  }, [geoData, width, height]);

  const pathGenerator = useMemo(() => {
    if (!projection) {
      return null;
    }

    return d3.geoPath().projection(projection);
  }, [projection]);

  const districts = useMemo(() => {
    if (!geoData || !pathGenerator) {
      return [];
    }

    const normalizedData = {
      ...geoData,
      features: geoData.features.map(normalizeFeatureWinding),
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
  }, [geoData, pathGenerator]);

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

  const handleMouseEnter = (event, info) => {
    setHoveredDistrict(info);
    updateTooltipPosition(event);
    setTooltip((prev) => ({ ...prev, visible: true }));
  };

  const handleMouseLeave = () => {
    setHoveredDistrict(null);
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
            const isHovered = hoveredDistrict?.name === district.name;

            return (
              <path
                key={district.id}
                d={district.path}
                className="district-shape"
                fill={isHovered ? "#e76f51" : "#95b89c"}
                stroke="#ffffff"
                strokeWidth={0.5}
                onMouseEnter={(event) => handleMouseEnter(event, district.info)}
                onMouseMove={updateTooltipPosition}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </svg>

        <div
          className={`map-tooltip ${tooltip.visible ? "visible" : ""}`}
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="tooltip-title">{hoveredDistrict?.name}</div>
          <div className="tooltip-row">HQ: {hoveredDistrict?.hq}</div>
        </div>
      </div>

      <aside className={`district-panel ${hoveredDistrict ? "active" : ""}`}>
        <h3>District Info</h3>

        {hoveredDistrict ? (
          <div>
            <p>
              <strong>Name:</strong> {hoveredDistrict.name}
            </p>
            <p>
              <strong>HQ:</strong> {hoveredDistrict.hq}
            </p>
            <p>
              <strong>Province:</strong> {hoveredDistrict.province}
            </p>
            <p>
              <strong>PCode:</strong> {hoveredDistrict.pcode}
            </p>
          </div>
        ) : (
          <p>Hover over a district on the map.</p>
        )}
      </aside>
    </div>
  );
}