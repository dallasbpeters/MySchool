import { Card } from './ui/card'
import NoAssignments from './no-assignments'

function EmptyState({ title, description }: { title: string, description: string }) {

  return (
    <Card className="rounded-md min-h-75 flex flex-col items-center justify-center py-12 text-center relative">
      <NoAssignments className="h-full w-full z-0 absolute" />
      <h2 className="text-lg font-semibold mb-2 z-2">{title}</h2>
      <p className="text-muted-foreground max-w-md z-2">
        {description}
      </p>
    </Card>
  )
}

export default EmptyState
