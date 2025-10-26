import ErrorLayout from '../../components/ErrorLayout';
import GatewayTimeoutIllustration from "../../components/Illustrations/GatewayTimeoutIllustration.tsx";


const GatewayTimeoutPage = () => {
  return (
    <ErrorLayout
      code="504"
      title="Gateway Timeout"
      message="The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server."
    >
      <GatewayTimeoutIllustration />
    </ErrorLayout>
  );
};

export default GatewayTimeoutPage;
