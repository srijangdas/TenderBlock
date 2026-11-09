import { BACKEND_CONTRACT, DEMO_MODE } from '../data/constants';
import DemoBidForm from './DemoBidForm';
import TeamBidForm from './TeamBidForm';

// Separate user experiences are intentional: the demo accepts two mock files,
// whereas the real Java backend accepts exactly one proposal PDF per bid.
export default function BidForm(props) {
  return !DEMO_MODE && BACKEND_CONTRACT === 'team'
    ? <TeamBidForm {...props} />
    : <DemoBidForm {...props} />;
}
