const nextConfig = {
  experimental: {
    serverActions: {
      // CRM uploads are validated server-side at 10MB for attachments. Allow
      // small multipart overhead so valid field-job photos reach the action.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
