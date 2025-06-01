import ErrorLayout from '../../components/ErrorLayout';
import UnauthorizedIllustration from "../../components/Illustrations/UnauthorizedIllustration.tsx";

const UnauthorizedPage = () => {
  return (
    <ErrorLayout
      code="401"
      title="Unauthorized Access"
      message="You need to be logged in to view this page. Please sign in with your credentials to continue."
    >
      <UnauthorizedIllustration />
    </ErrorLayout>
  );
};

export default UnauthorizedPage;