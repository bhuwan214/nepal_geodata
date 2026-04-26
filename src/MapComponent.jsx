import { useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import nepalDataRaw from "./assets/map/nepal-districts-new.geojson?raw";
// import nepalDataRaw from "./assets/map/nepal-map.geojson?raw";

const nepalData = JSON.parse(nepalDataRaw);

const getDistrictInfo = (feature) => {
  const properties = feature.properties;
  return {
    name: properties.DIST_EN,
    pcode: properties.DIST_PCODE,
    province: `Province ${properties.ADM1_EN}`,
    area: Number(properties.Shape_Area).toFixed(4),
  };
};

export default function MapComponent() {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false });
  const mapContainerRef = useRef(null);
  const frameRef = useRef(null);

  const width = 900;
  const height = 500;

  const projection = useMemo(
    () => d3.geoMercator().fitSize([width, height], nepalData),
    [width, height]
  );
  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  const districts = useMemo(
    () =>
      nepalData.features.map((feature, i) => ({
        id: `${feature.properties.DIST_PCODE}-${i}`,
        name: feature.properties.DIST_EN,
        path: pathGenerator(feature),
        info: getDistrictInfo(feature),
      })),
    [pathGenerator]
  );

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
            >
              {/* <title>{district.name}</title> */}
            </path>
          );
        })}
        </svg>

        <div
          className={`map-tooltip ${tooltip.visible ? "visible" : ""}`}
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="tooltip-title">{hoveredDistrict?.name}</div>
          <div className="tooltip-row">Code: {hoveredDistrict?.pcode}</div>
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
              <strong>PCode:</strong> {hoveredDistrict.pcode}
            </p>
            <p>
              <strong>Province:</strong> {hoveredDistrict.province}
            </p>
            <p>
              <strong>Shape Area:</strong> {hoveredDistrict.area}
            </p>
          </div>
        ) : (
          <p>Hover over a district on the map.</p>
        )}
      </aside>
    </div>
  );
}