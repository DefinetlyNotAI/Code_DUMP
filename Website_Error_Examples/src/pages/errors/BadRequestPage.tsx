import ErrorLayout from '../../components/ErrorLayout';
import BadRequestIllustration from '../../components/Illustrations/BadRequestIllustration';

const BadRequestPage = () => {
  return (
    <ErrorLayout
      code="400"
      title="Bad Request"
      message="The server cannot process your request due to something that is perceived to be a client error."
    >
      <BadRequestIllustration />
    </ErrorLayout>
  );
};

export default BadRequestPage;