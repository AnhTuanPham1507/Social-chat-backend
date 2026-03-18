// Core DDD base classes
export * from './core';

// Asset domain
export * from './asset/asset.entity';
export * from './asset/asset-size.value-object';
export * from './asset/asset-type.value-object';
export * from './asset/asset-purpose.enum';
export * from './asset/asset-status.enum';
export * from './asset/mime-type.value-object';
export * from './asset/max-exceed-size.exception';
export * from './asset/image-variant.constant';
export * from './asset/video-variant.constant';
export * from './asset/events/asset-confirmed.event';

// User domain
export * from './user/user.entity';
export * from './user/user-avatar.value-object';
export * from './user/user-phone.value-object';
export * from './user/user-sex.value-object';
export * from './user/events';

// Common value objects
export * from './common/email.value-object';
export * from './common/phone.value-object';
export * from './common/url.value-object';

// Conversation domain
export * from './conversation/conversation-type.enum';
export * from './conversation/participant-role.enum';

// Message domain
export * from './message/message-type.enum';
export * from './message/message-status.enum';

// Friendship domain
export * from './friendship/friendship-status.enum';

// Presence domain
export * from './presence/presence-status.enum';

// Reaction domain
export * from './reaction/reaction-type.enum';

// Post domain
export * from './post/post-visibility.enum';

// Feed domain
export * from './feed/post.entity';
export * from './feed/post-content.value-object';
export * from './feed/events';

// Notification domain
export * from './notification/notification-type.enum';

// Error codes
export * from './error-code.const';



