import ErrorLayout from '../../components/ErrorLayout';
import TooManyRequestsIllustration from "../../components/Illustrations/TooManyRequestsIllustration.tsx";

const TooManyRequestsPage = () => {
  return (
    <ErrorLayout
      code="429"
      title="Too Many Requests"
      message="You have sent too many requests in a given amount of time. Please wait before trying again."
    >
      <TooManyRequestsIllustration />
    </ErrorLayout>
  );
};

export default TooManyRequestsPage;