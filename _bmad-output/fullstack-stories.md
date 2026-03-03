---
status: active
backend_path: "C:/Users/EVT-LTP-ThanhTuan/OneDrive/Desktop/source-code/Social-chat-backend"
frontend_path: "C:/Users/EVT-LTP-ThanhTuan/OneDrive/Desktop/source-code/Socialchat-FE"
---

# Fullstack Implementation Guide - sproux-service

This document maps each backend story to its corresponding frontend implementation. After completing a backend story, use this guide to build the matching UI.

---

## Frontend Architecture Summary

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 14 (App Router) |
| **UI Library** | Shadcn/ui + Tailwind CSS |
| **State** | Zustand (auth), React Query (server state) |
| **Forms** | React Hook Form + Zod |
| **HTTP Client** | `src/lib/backend-client.ts` |
| **Types** | `src/types/index.ts` |

### Existing Frontend Structure
```
src/
├── app/
│   ├── (auth)/signin, callback
│   └── (dashboard)/dashboard
├── components/
│   ├── features/posts/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── auth-store.ts
│   ├── backend-client.ts
│   └── http-client.ts
└── types/index.ts
```

---

## Epic 1: DDD Foundation & Architecture Patterns

**Frontend Impact:** None - Backend only

---

## Epic 2: User Identity & Profile Management

### Story 2.1: OAuth2/OIDC Authentication Flow
**Backend:** `POST /auth/callback`
**Frontend Status:** ✅ Already implemented
- `src/app/(auth)/signin/page.tsx`
- `src/app/(auth)/callback/page.tsx`

---

### Story 2.2: JWT Token Validation
**Backend:** JWT Guard on all protected endpoints
**Frontend Status:** ✅ Already implemented
- `src/lib/http-client.ts` - adds Authorization header
- `src/lib/backend-client.ts` - handles 401 redirect

---

### Story 2.3: User Profile Creation on First Login
**Backend:** Auto-creates user on first OAuth login
**Frontend Status:** ✅ Handled by callback page

---

### Story 2.4: Update User Profile
**Backend:** `PUT /users/profile`

**Frontend Task:**
```
Location: src/app/(dashboard)/profile/page.tsx (CREATE)
          src/components/features/profile/edit-profile-form.tsx (CREATE)

Components needed:
- Profile page with user info display
- Edit profile modal/form
- Fields: displayName

API Integration:
- GET /users/me → fetch current profile
- PUT /users/profile → update profile

React Query hooks:
- useCurrentUser()
- useUpdateProfile()
```

---

### Story 2.5: Upload Profile Picture
**Backend:** `POST /users/avatar`

**Frontend Task:**
```
Location: src/components/features/profile/avatar-upload.tsx (CREATE)

Components needed:
- Avatar upload component with preview
- Image cropper (optional)
- Upload progress indicator

API Integration:
- POST /users/avatar (multipart/form-data)

Libraries:
- Already have @uploadthing/react, or use native fetch
```

---

### Story 2.6: Register Device Token for Push
**Backend:** `POST /users/devices`

**Frontend Task:**
```
Location: src/lib/push-notifications.ts (CREATE)

Implementation:
- Request notification permission on login
- Get FCM token
- Send to backend on auth success

API Integration:
- POST /users/devices { deviceToken, platform: 'web' }
```

---

### Story 2.7: User Logout
**Backend:** `POST /auth/logout`
**Frontend Status:** ✅ Already implemented
- `src/lib/auth-store.ts` - signOut method

---

### Story 2.8: RBAC Guard Implementation
**Backend:** Role-based guards
**Frontend Task:**
```
Location: src/lib/auth-utils.ts (CREATE)

Implementation:
- hasRole(user, 'admin') helper
- ProtectedRoute component wrapper
- Hide admin-only UI elements
```

---

## Epic 3: Social Network Building

### Story 3.1: Send Friend Request
**Backend:** `POST /friends/request`

**Frontend Task:**
```
Location: src/components/features/friends/add-friend-button.tsx (CREATE)
          src/app/(dashboard)/friends/page.tsx (CREATE)

Components needed:
- "Add Friend" button on user profiles
- Pending request indicator
- Friends page layout

API Integration:
- POST /friends/request { targetUserId }

React Query:
- useSendFriendRequest()
```

---

### Story 3.2: Accept or Decline Friend Request
**Backend:** `PUT /friends/request/:id`

**Frontend Task:**
```
Location: src/components/features/friends/friend-request-card.tsx (CREATE)
          src/components/features/friends/friend-requests-list.tsx (CREATE)

Components needed:
- Friend request card with Accept/Decline buttons
- Requests list (incoming tab)
- Toast notifications on action

API Integration:
- GET /friends/requests/incoming
- PUT /friends/request/:id { action: 'accept' | 'decline' }

React Query:
- useFriendRequests()
- useRespondToRequest()
```

---

### Story 3.3: View Friends List
**Backend:** `GET /friends`

**Frontend Task:**
```
Location: src/components/features/friends/friends-list.tsx (CREATE)
          src/app/(dashboard)/friends/page.tsx (UPDATE)

Components needed:
- Friends list with avatars
- Search/filter friends
- Pagination/infinite scroll

API Integration:
- GET /friends?page=1&limit=20

React Query:
- useFriends()
```

---

### Story 3.4: Unfriend User
**Backend:** `DELETE /friends/:userId`

**Frontend Task:**
```
Location: src/components/features/friends/friend-card.tsx (CREATE)

Components needed:
- Friend card with dropdown menu
- "Unfriend" option with confirmation
- Optimistic update

API Integration:
- DELETE /friends/:userId

React Query:
- useUnfriend()
```

---

### Story 3.5: Block User
**Backend:** `POST /users/:userId/block`

**Frontend Task:**
```
Location: src/components/features/users/user-actions-menu.tsx (CREATE)

Components needed:
- User actions dropdown
- "Block" option with confirmation
- Blocked users list in settings

API Integration:
- POST /users/:userId/block
- GET /users/blocked (for settings)
```

---

### Story 3.6: Unblock User
**Backend:** `DELETE /users/:userId/block`

**Frontend Task:**
```
Location: src/app/(dashboard)/settings/blocked/page.tsx (CREATE)

Components needed:
- Blocked users list
- "Unblock" button per user

API Integration:
- DELETE /users/:userId/block
```

---

### Story 3.7: View Friend Suggestions
**Backend:** `GET /friends/suggestions`

**Frontend Task:**
```
Location: src/components/features/friends/friend-suggestions.tsx (CREATE)

Components needed:
- Suggestions sidebar widget
- "Add Friend" quick action
- Show mutual friends count

API Integration:
- GET /friends/suggestions?limit=5
```

---

## Epic 4: Content Creation & Engagement

### Story 4.1: Create Text Post
**Backend:** `POST /posts`
**Frontend Status:** ✅ Partially done
- `src/components/features/posts/create-post-form.tsx` exists

**Frontend Task:**
```
Update: src/components/features/posts/create-post-form.tsx

Ensure:
- Calls POST /posts with { content }
- Shows success toast
- Invalidates feed query
```

---

### Story 4.2-4.3: Attach Images/Videos to Post
**Backend:** Images/videos in POST /posts

**Frontend Task:**
```
Update: src/components/features/posts/create-post-form.tsx

Add:
- Image upload button
- Image preview grid
- Remove image option
- Video upload (single)

API Integration:
- POST /assets/upload → get URLs
- Include imageUrls/videoUrls in post creation
```

---

### Story 4.4: Set Post Audience Visibility
**Backend:** `visibility` field in POST /posts

**Frontend Task:**
```
Update: src/components/features/posts/create-post-form.tsx

Add:
- Visibility dropdown (Public, Friends, Specific)
- Default to Friends
- Icon indicator for visibility
```

---

### Story 4.5: View Post Details
**Backend:** `GET /posts/:id`

**Frontend Task:**
```
Location: src/app/(dashboard)/posts/[id]/page.tsx (CREATE)

Components needed:
- Full post view page
- Author info
- Reaction counts
- Comments section

API Integration:
- GET /posts/:id
```

---

### Story 4.6: Delete Own Post
**Backend:** `DELETE /posts/:id`

**Frontend Task:**
```
Update: src/components/features/posts/post-card.tsx

Add:
- Three-dot menu for own posts
- "Delete" option with confirmation
- Optimistic removal from feed
```

---

### Story 4.7: React to Post
**Backend:** `POST /posts/:id/reactions`

**Frontend Task:**
```
Location: src/components/features/posts/reaction-button.tsx (CREATE)

Components needed:
- Reaction picker (like, love, haha, wow, sad, angry)
- Current reaction indicator
- Animated reaction feedback

API Integration:
- POST /posts/:id/reactions { type }
- DELETE /posts/:id/reactions (remove)
```

---

### Story 4.8-4.9: Comments
**Backend:** `POST /posts/:id/comments`, `GET /posts/:id/comments`

**Frontend Task:**
```
Location: src/components/features/posts/comments-section.tsx (CREATE)
          src/components/features/posts/comment-input.tsx (CREATE)
          src/components/features/posts/comment-card.tsx (CREATE)

Components needed:
- Comments list under post
- Comment input field
- Comment card with author

API Integration:
- GET /posts/:id/comments
- POST /posts/:id/comments { content }
```

---

### Story 4.10: Share Post
**Backend:** `POST /posts/:id/share`

**Frontend Task:**
```
Location: src/components/features/posts/share-button.tsx (CREATE)

Components needed:
- Share button on post card
- Optional comment modal
- Share count display
```

---

### Story 4.11: Hashtag Extraction
**Backend:** Auto-extracts hashtags
**Frontend Task:**
```
Update: src/components/features/posts/post-card.tsx

Add:
- Clickable hashtags in post content
- Link to /explore?hashtag=xxx
```

---

## Epic 5: Personalized Feed & Discovery

### Story 5.1-5.2: View Home Feed with Pagination
**Backend:** `GET /feed`
**Frontend Status:** ✅ Partially done
- `src/components/features/posts/post-feed.tsx` exists

**Frontend Task:**
```
Update: src/components/features/posts/post-feed.tsx

Ensure:
- Calls GET /feed with pagination
- Infinite scroll loading
- Pull-to-refresh
```

---

### Story 5.3-5.4: Real-time Feed Updates
**Backend:** WebSocket feed updates

**Frontend Task:**
```
Location: src/lib/websocket.ts (CREATE)
          src/hooks/use-feed-socket.ts (CREATE)

Implementation:
- WebSocket connection on dashboard mount
- Listen for 'new_post' events
- Show "New posts available" banner
- Auto-insert or click to load
```

---

## Epic 6: Real-time Messaging & Conversations

### Story 6.1: Start One-on-One Conversation
**Backend:** `POST /conversations`

**Frontend Task:**
```
Location: src/app/(dashboard)/messages/page.tsx (CREATE)
          src/components/features/messages/conversation-list.tsx (CREATE)
          src/components/features/messages/new-conversation-modal.tsx (CREATE)

Components needed:
- Messages page layout (sidebar + chat area)
- Conversation list
- New conversation button/modal
- User search for starting chat

API Integration:
- POST /conversations { participantId }
- GET /conversations
```

---

### Story 6.2: Send Text Message
**Backend:** `POST /conversations/:id/messages`

**Frontend Task:**
```
Location: src/components/features/messages/chat-input.tsx (CREATE)
          src/components/features/messages/message-bubble.tsx (CREATE)

Components needed:
- Message input with send button
- Message bubble (sent/received styles)
- Sending indicator

API Integration:
- POST /conversations/:id/messages { content }
```

---

### Story 6.3: View Message History
**Backend:** `GET /conversations/:id/messages`

**Frontend Task:**
```
Location: src/components/features/messages/chat-window.tsx (CREATE)

Components needed:
- Scrollable message list
- Load older messages on scroll up
- Date separators

API Integration:
- GET /conversations/:id/messages?cursor=xxx
```

---

### Story 6.4: Real-time Message Delivery
**Backend:** WebSocket message push

**Frontend Task:**
```
Location: src/hooks/use-chat-socket.ts (CREATE)

Implementation:
- WebSocket subscription per conversation
- Real-time message insertion
- Sound notification
```

---

### Story 6.5-6.6: Send Images/Files in Chat
**Backend:** Message with imageUrl/fileUrl

**Frontend Task:**
```
Update: src/components/features/messages/chat-input.tsx

Add:
- Attachment button
- Image preview before send
- File upload with progress
- Image/file message bubble variants
```

---

### Story 6.7-6.8: Delivery Status & Read Receipts
**Backend:** Message status updates

**Frontend Task:**
```
Update: src/components/features/messages/message-bubble.tsx

Add:
- Single check (sent)
- Double check (delivered)
- Blue double check (read)
- Status via WebSocket updates
```

---

### Story 6.9: View Conversations List
**Backend:** `GET /conversations`
**Frontend:** Part of Story 6.1

---

### Story 6.10-6.12: Group Conversations
**Backend:** Group CRUD

**Frontend Task:**
```
Location: src/components/features/messages/create-group-modal.tsx (CREATE)
          src/components/features/messages/group-settings.tsx (CREATE)

Components needed:
- Create group modal with member selection
- Group name input
- Group info/settings panel
- Add/remove members
- Leave group option
```

---

## Epic 7: Presence & Real-time Status

### Story 7.1-7.2: Online/Offline Status
**Backend:** Presence via Redis/WebSocket

**Frontend Task:**
```
Location: src/components/ui/online-indicator.tsx (CREATE)
          src/hooks/use-presence.ts (CREATE)

Components needed:
- Green dot indicator component
- "Last seen X ago" text
- Use on avatars, chat list, profile

WebSocket:
- Subscribe to presence updates for friends
- Update UI in real-time
```

---

### Story 7.3: Typing Indicators
**Backend:** WebSocket typing events

**Frontend Task:**
```
Location: src/components/features/messages/typing-indicator.tsx (CREATE)

Components needed:
- "User is typing..." text with animation
- Debounced typing event emit
- Auto-hide after 3 seconds

WebSocket:
- Emit typing event on input change
- Listen for typing events from others
```

---

### Story 7.4: Connection/Disconnection Updates
**Backend:** Presence events
**Frontend:** Part of Story 7.1-7.2

---

## Epic 8: Notifications & Activity Updates

### Story 8.1-8.2: View Notification List
**Backend:** `GET /notifications`

**Frontend Task:**
```
Location: src/app/(dashboard)/notifications/page.tsx (CREATE)
          src/components/features/notifications/notification-list.tsx (CREATE)
          src/components/features/notifications/notification-item.tsx (CREATE)

Components needed:
- Notifications page
- Notification item with icon per type
- Click to navigate to related content
- Unread styling

API Integration:
- GET /notifications?page=1&limit=20
```

---

### Story 8.3: Unread Notification Count
**Backend:** `GET /notifications/unread-count`

**Frontend Task:**
```
Update: src/components/layout/dashboard-sidebar.tsx

Implementation:
- Fetch unread count on mount
- Display badge on Notifications nav item
- Real-time updates via WebSocket

API Integration:
- GET /notifications/unread-count
```

---

### Story 8.4-8.5: Mark Notifications as Read
**Backend:** `PUT /notifications/:id/read`, `PUT /notifications/read-all`

**Frontend Task:**
```
Update: src/components/features/notifications/notification-item.tsx

Add:
- Mark as read on click/view
- "Mark all as read" button
- Optimistic update

API Integration:
- PUT /notifications/:id/read
- PUT /notifications/read-all
```

---

### Story 8.6: Push Notifications
**Backend:** FCM push
**Frontend Task:**
```
Location: src/lib/push-notifications.ts (UPDATE from 2.6)

Add:
- Service worker for background notifications
- Notification click handling
- Focus app on notification click
```

---

### Story 8.7: Notification Aggregation
**Backend:** Aggregated notifications
**Frontend Task:**
```
Update: src/components/features/notifications/notification-item.tsx

Handle:
- "John and 5 others liked your post" format
- Expandable to show individual items
```

---

## Epic 9: AI-Powered Assistance

### Story 9.1-9.3: AI Chatbot
**Backend:** `POST /ai/conversations`, `/ai/conversations/:id/messages`

**Frontend Task:**
```
Location: src/app/(dashboard)/ai/page.tsx (CREATE)
          src/components/features/ai/ai-chat.tsx (CREATE)
          src/components/features/ai/ai-message.tsx (CREATE)

Components needed:
- AI chat page or floating widget
- Chat history
- Streaming response display
- Markdown rendering for AI responses

API Integration:
- POST /ai/conversations
- POST /ai/conversations/:id/messages
- SSE/WebSocket for streaming response
```

---

### Story 9.4-9.7: AI Features (Summarize, Suggest)
**Backend:** AI endpoints

**Frontend Task:**
```
Location: src/components/features/ai/ai-actions.tsx (CREATE)

Components needed:
- "Summarize feed" button
- "Help me write" in post composer
- "Summarize chat" in conversation
- Inline AI suggestions
```

---

## Quick Reference: API Endpoints → UI

| Endpoint | Method | Frontend Location |
|----------|--------|-------------------|
| `/auth/callback` | GET | `app/(auth)/callback` ✅ |
| `/auth/logout` | POST | `lib/auth-store.ts` ✅ |
| `/users/profile` | PUT | `features/profile/edit-profile-form` |
| `/users/avatar` | POST | `features/profile/avatar-upload` |
| `/users/devices` | POST | `lib/push-notifications` |
| `/friends` | GET | `features/friends/friends-list` |
| `/friends/request` | POST | `features/friends/add-friend-button` |
| `/friends/request/:id` | PUT | `features/friends/friend-request-card` |
| `/friends/suggestions` | GET | `features/friends/friend-suggestions` |
| `/posts` | POST | `features/posts/create-post-form` ✅ |
| `/posts/:id` | GET | `app/(dashboard)/posts/[id]` |
| `/posts/:id` | DELETE | `features/posts/post-card` |
| `/posts/:id/reactions` | POST | `features/posts/reaction-button` |
| `/posts/:id/comments` | GET/POST | `features/posts/comments-section` |
| `/feed` | GET | `features/posts/post-feed` ✅ |
| `/conversations` | GET/POST | `features/messages/conversation-list` |
| `/conversations/:id/messages` | GET/POST | `features/messages/chat-window` |
| `/notifications` | GET | `features/notifications/notification-list` |
| `/notifications/unread-count` | GET | `layout/dashboard-sidebar` |
| `/ai/conversations` | POST | `features/ai/ai-chat` |

---

## Implementation Workflow

After completing each backend story:

1. **Check this document** for the corresponding frontend task
2. **Create/update files** in the frontend repo at specified locations
3. **Add types** to `src/types/index.ts` if needed
4. **Create React Query hooks** in `src/hooks/` for API calls
5. **Test the integration** end-to-end

---

## Shared Types to Add (Frontend)

When implementing, add these to `src/types/index.ts`:

```typescript
// Friends
export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: 'pending' | 'accepted' | 'declined'
  sender: User
  receiver: User
  createdAt: Date
}

export interface Friendship {
  id: string
  userId: string
  friendId: string
  friend: User
  createdAt: Date
}

// Messages
export interface Conversation {
  id: string
  type: 'direct' | 'group'
  name?: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  createdAt: Date
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'file'
  imageUrl?: string
  fileUrl?: string
  fileName?: string
  status: 'sent' | 'delivered' | 'read'
  createdAt: Date
  sender: User
}

// Reactions
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

export interface Reaction {
  id: string
  userId: string
  postId: string
  type: ReactionType
  user: User
}

// Presence
export interface UserPresence {
  userId: string
  status: 'online' | 'offline'
  lastSeen?: Date
}
```
