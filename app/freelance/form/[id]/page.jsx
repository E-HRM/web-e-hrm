import FreelanceFormClient from './FreelanceFormClient';

export default function FreelanceFormPage({ params }) {
  return <FreelanceFormClient freelanceId={params.id} />;
}
