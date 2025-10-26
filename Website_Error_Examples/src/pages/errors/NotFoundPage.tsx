import ErrorLayout from '../../components/ErrorLayout';
import NotFoundIllustration from '../../components/Illustrations/NotFoundIllustration';

const NotFoundPage = () => {
  return (
    <ErrorLayout
      code="404"
      title="Page Not Found"
      message="The page you are looking for doesn't exist or has been moved. Check the URL or go back to the homepage."
    >
      <NotFoundIllustration />
    </ErrorLayout>
  );
};

export default NotFoundPage;