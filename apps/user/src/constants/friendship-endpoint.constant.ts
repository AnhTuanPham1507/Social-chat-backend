const FRIENDSHIP_ENDPOINT = {
    BASE: '/friends',
    REQUEST: '/request',
    REQUEST_PENDING: '/request/pending',
    REQUEST_BY_ID: '/request/:id',
    STATUS: '/status/:userId',
    BY_USER_ID: '/:userId',
    BLOCK: '/:userId/block',
    UNBLOCK: '/:userId/block',
    SUGGESTIONS: '/suggestions',
};

export default FRIENDSHIP_ENDPOINT;
