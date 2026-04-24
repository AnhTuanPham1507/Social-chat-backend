const ENDPOINT = {
  WEBHOOK: {
    BASE: '/webhook',
    COCONUT: '/coconut',
  },
  ASSET: {
    BASE: '/assets',
    PRESIGN_UPLOAD: '/presign-upload',
    BULK_PRESIGN_UPLOAD: '/bulk-presign-upload',
    CONFIRM: '/:assetId/confirm',
    RESIZE: '/:assetId/resize',
    VALIDATE: '/validate',
    DELETE: '/:assetId',
    // Multipart upload
    INITIATE_MULTIPART: '/multipart/initiate',
    COMPLETE_MULTIPART: '/:assetId/multipart/complete',
    ABORT_MULTIPART: '/:assetId/multipart/abort',
  },
};

export default ENDPOINT;
