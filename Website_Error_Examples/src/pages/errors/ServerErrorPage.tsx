import ErrorLayout from '../../components/ErrorLayout';
import ServerErrorIllustration from '../../components/Illustrations/ServerErrorIllustration';

const ServerErrorPage = () => {
  return (
    <ErrorLayout
      code="500"
      title="Internal Server Error"
      message="Something went wrong on our servers. We're working to fix the issue. Please try again later."
    >
      <ServerErrorIllustration />
    </ErrorLayout>
  );
};

export default ServerErrorPage;