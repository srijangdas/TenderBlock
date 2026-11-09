import PageTitle from '../components/PageTitle';
import TenderForm from '../components/TenderForm';

// The only tender-creation screen. The Lister dashboard contains no duplicate form or button.
export default function CreateTenderPage() {
  return <>
    <PageTitle title="Create a tender" subtitle="Submit a tender request for Admin approval. Publication happens separately." />
    <TenderForm />
  </>;
}
