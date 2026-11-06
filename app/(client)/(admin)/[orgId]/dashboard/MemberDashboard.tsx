import MoodCheck from "./MoodCheck"
import OrganizationHeader from "./OrganizationHeader"

export default function MemberDashboard({ organization }: { organization: { _id: string; name: string } }) {
    return (
        <div className="space-y-4">
            <OrganizationHeader name={organization.name} slug={organization._id} />
            <div className="max-w-xl">
                <MoodCheck orgId={organization._id} />
            </div>
        </div>
    )
}
