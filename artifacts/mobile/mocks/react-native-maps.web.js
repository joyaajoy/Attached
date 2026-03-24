const React = require("react");
const { View } = require("react-native");

const MapView = ({ children, style, ...props }) => React.createElement(View, { style }, children);
const Marker = ({ children, ...props }) => React.createElement(View, null, children);
const Polyline = () => null;
const Polygon = () => null;
const Circle = () => null;
const Callout = ({ children }) => React.createElement(View, null, children);

MapView.Marker = Marker;
MapView.Polyline = Polyline;
MapView.Polygon = Polygon;
MapView.Circle = Circle;
MapView.Callout = Callout;

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.Polyline = Polyline;
module.exports.Polygon = Polygon;
module.exports.Circle = Circle;
module.exports.Callout = Callout;
module.exports.PROVIDER_GOOGLE = "google";
module.exports.PROVIDER_DEFAULT = null;
