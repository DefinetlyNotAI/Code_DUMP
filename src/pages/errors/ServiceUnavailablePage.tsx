import ErrorLayout from '../../components/ErrorLayout';
import ServiceUnavailableIllustration from '../../components/Illustrations/ServiceUnavailableIllustration';


const ServiceUnavailablePage = () => {
  return (
    <ErrorLayout
      code="503"
      title="Service Unavailable"
      message="Our service is currently unavailable due to maintenance or high load. Please try again later."
    >
      <ServiceUnavailableIllustration />
    </ErrorLayout>
  );
};

export default ServiceUnavailablePage;