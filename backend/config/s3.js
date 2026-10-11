const { S3Client, PutObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

// Shared S3 client used for uploading and removing incident photos. Explicit
// keys are passed only when set, so the SDK's default credential chain still
// applies otherwise.
const client = new S3Client({
  region: process.env.AWS_REGION,
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })
});

// Thin wrappers so callers just await with the same params as before
const upload = params => client.send(new PutObjectCommand(params));
const deleteObjects = params => client.send(new DeleteObjectsCommand(params));

module.exports = { upload, deleteObjects };
