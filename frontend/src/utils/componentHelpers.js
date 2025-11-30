export const handleFieldChange = (event) => {
  // Extract name and value from an event to an object
  const returnObj = {};
  returnObj[event.target.name] = event.target.value;
  return returnObj;
};
