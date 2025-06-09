import getApiBaseUrl from '../config/apiConfig';

export const getImageUrl = (imageName) => {
  if (!imageName || imageName === 'default_group.png') {
    return '/default_group.png';  
  }
  if (imageName.startsWith('http://') || imageName.startsWith('https://') || imageName.startsWith('/')) {
    return imageName;  
  }
  return `${getApiBaseUrl()}/images/${imageName}`;
};