# Appwrite Permissions Configuration Guide

## Problem
Meal logging fails with: **"No permissions provided for action 'create'"** (401 Unauthorized)

The `meals`, `journal`, and `profiles` collections in Appwrite are rejecting operations because default permissions don't allow authenticated users to create/read documents.

## Solution: Set Collection Permissions

### Step 1: Log into Appwrite Console
1. Go to your Appwrite console: https://fra.cloud.appwrite.io
2. Navigate to **Databases** → **nutrican_db**

### Step 2: Configure "profiles" Collection Permissions
1. Click on the **profiles** collection
2. Go to the **Settings** tab
3. Scroll to **Permissions**
4. Click **+ Add Permission**
5. Select:
   - **Role**: `User`
   - **Permission**: `create` (repeat for `read`, `update`, `delete`)
6. Repeat for: `read`, `update`, `delete`
7. Save

### Step 3: Configure "meals" Collection Permissions
Repeat Step 2 for the **meals** collection with permissions:
- `create` - Allow users to log meals
- `read` - Allow users to view their meals
- `update` - Allow users to edit meals
- `delete` - Allow users to remove meals

### Step 4: Configure "journal" Collection Permissions
Repeat Step 2 for the **journal** collection with the same permissions (create, read, update, delete)

### Step 5: Configure "chat" Collection Permissions
Repeat Step 2 for the **chat** collection with the same permissions:
- `create` - Allow users to send chat messages
- `read` - Allow users to view chat history
- `update` - Allow users to like messages
- `delete` - Allow users to delete messages

## Alternative: Document-Level Permissions via API

If collection-level permissions don't work, add document-level permissions in the API:

```javascript
// In db.ts, after creating a document:
const doc = await databases.createDocument(
    APPWRITE_DATABASE_ID,
    APPWRITE_MEALS_COLLECTION,
    ID.unique(),
    { /* data */ }
);

// Add document permissions for the user
await databases.updateDocument(
    APPWRITE_DATABASE_ID,
    APPWRITE_MEALS_COLLECTION,
    doc.$id,
    { /* data */ },
    [
        Permission.read(Role.user(user.$id)),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id))
    ]
);
```

## Testing
After configuring permissions:
1. Refresh the app
2. Try logging a meal
3. Check browser console - should see meal created without 401 errors

## Common Issues

### Premium upgrade fails with "Unknown attribute: subscriptionStartedAt"
If payment succeeds but Premium is not fully activated, your `profiles` collection schema is missing subscription fields.

Add these attributes in Appwrite:
1. Go to **Databases** -> **nutrican_db** -> **profiles** -> **Attributes**
2. Create attribute: `subscriptionStartedAt`
    - Type: `string`
    - Size: `64`
    - Required: `no`
3. Create attribute: `subscriptionExpiresAt`
    - Type: `string`
    - Size: `64`
    - Required: `no`
4. Deploy attributes and retry Premium activation

Note: The app now has a compatibility fallback that can still set `plan = Premium` when these fields are missing, but adding both attributes is required for full 30-day countdown and automatic expiry behavior.

### Still seeing 401 errors?
- **Clear browser cache** and hard refresh (Ctrl+Shift+R)
- **Check Appwrite API logs** for detailed permission errors
- **Verify user is authenticated** - check that session is active

### Profile updates also failing?
- Follow Step 2 for the **profiles** collection
- Ensure user creating profile record is the authenticated user

### Need to verify permissions?
In Appwrite Console:
1. Go to collection **Settings**
2. Click each permission entry to review
3. Ensure `User` role is selected (not `Guest`)

## Production Recommendation
For production deployment, consider:
1. Using **API keys with specific scopes** instead of session-based auth
2. Setting up a **cloud function** to handle document creation with proper permissions
3. Using Appwrite's **permission system** with custom roles if needed
