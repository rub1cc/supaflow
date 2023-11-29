export const createOGImage = ({
  title,
  updatedAt,
  steps,
  authorName,
  authorAvatar,
}: {
  title: string;
  updatedAt: string;
  steps: string;
  authorName: string;
  authorAvatar: string;
}) => {
  const params = new URLSearchParams();

  params.append("title", title);
  params.append("updatedAt", updatedAt);
  params.append("steps", steps);
  params.append("authorName", authorName);
  params.append("authorAvatar", authorAvatar);

  return window.location.origin + "/api/og?" + params.toString();
};
