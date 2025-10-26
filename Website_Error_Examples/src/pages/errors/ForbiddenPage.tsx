import ErrorLayout from '../../components/ErrorLayout';
import ForbiddenIllustration from '../../components/Illustrations/ForbiddenIllustration';

const ForbiddenPage = () => {
  return (
    <ErrorLayout
      code="403"
      title="Access Forbidden"
      message="You don't have permission to access this resource. Please contact your administrator if you believe this is an error."
    >
      <ForbiddenIllustration />
    </ErrorLayout>
  );
};

export default ForbiddenPage;