import ErrorLayout from '../../components/ErrorLayout';
import BadGatewayIllustration from "../../components/Illustrations/BadGatewayIllustration.tsx";


const BadGatewayPage = () => {
  return (
    <ErrorLayout
      code="502"
      title="Bad Gateway"
      message="The server received an invalid response from an upstream server while trying to fulfill the request."
    >
      <BadGatewayIllustration />
    </ErrorLayout>
  );
};

export default BadGatewayPage;