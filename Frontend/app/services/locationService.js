// services/locationService.js
export const getCityNameById = async (id, citiesMap, setCitiesMap) => {
  if (!id) return null;
  
  // Check if we already have this city in our cache
  if (citiesMap && citiesMap[id]) {
    return citiesMap[id];
  }
  
  try {
    const resp = await fetch(
      `https://data.gov.il/api/3/action/datastore_search?resource_id=8f714b6f-c35c-4b40-a0e7-547b675eee0e&filters={"_id":${id}}`
    );
    const json = await resp.json();
    if (json.success && json.result.records.length) {
      const name = json.result.records[0]['city_name_en'];
      if (setCitiesMap) {
        setCitiesMap(m => ({ ...m, [id]: name }));
      }
      return name;
    }
  } catch (e) {
    console.error('Failed to fetch city name:', e);
  }
  return 'Unknown';
};
