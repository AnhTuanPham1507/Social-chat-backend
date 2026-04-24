const FEED_ENDPOINT = {
    BASE: '/feeds',
    POSTS: '/posts',
    POST_BY_ID: '/posts/:id',
    SHARE_POST: '/posts/:id/share',
    MY_POSTS: '/posts/me',
    USER_POSTS: '/posts/user/:authorId',
    SEARCH_POSTS: '/posts/search',
    POST_REACTIONS: '/posts/:postId/reactions',
    COMMENTS: '/posts/:postId/comments',
    COMMENT_BY_ID: '/posts/:postId/comments/:commentId',
    COMMENT_REPLIES: '/posts/:postId/comments/:commentId/replies',
    COMMENT_REACTIONS: '/posts/:postId/comments/:commentId/reactions',
};

export default FEED_ENDPOINT;
