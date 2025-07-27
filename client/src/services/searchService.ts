import { fetchData } from '@/utils/axiosHelpers';   

export const searchService = {
    searchAll: (query: string) => {
        return fetchData(
            `/users/search?query=${query}`,
            {
                method: 'GET',
            },
            'Failed to search',
        );
    },

    getPostsByHashtag: (tag: string) => {
        return fetchData(
            `/users/search/hashtag/${tag}`,
            {
                method: 'GET',
            },
            'Failed to fetch posts by hashtag',
        );
    }
};