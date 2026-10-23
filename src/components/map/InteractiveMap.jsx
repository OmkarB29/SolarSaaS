import React from 'react';
import GoogleSolarMap from './GoogleSolarMap';

/**
 * InteractiveMap adapter component.
 * Provides backwards compatibility for any components consuming InteractiveMap,
 * delegating all rendering to GoogleSolarMap.
 */
const InteractiveMap = (props) => {
  return <GoogleSolarMap {...props} />;
};

export default InteractiveMap;
