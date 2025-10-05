import getAccessToken from './auth.mjs';

export const getAllCategories = async (accessToken) => {
    if (!accessToken) {
        return null
    }
    

};
const saveCategoriesToDatabase = () => {};
const upCategories = async () => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const category = await getAllCategories(accessToken);
    if (category) {
      await saveCategoriesToDatabase(category);
    }
  }
};

export { saveCategoriesToDatabase, upCategories };
