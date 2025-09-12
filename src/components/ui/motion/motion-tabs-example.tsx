import MotionTabs from './motion-tabs'

export default function MotionTabsExample() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div>
          <h3>Overview Content</h3>
          <p>This is the overview tab content.</p>
        </div>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      content: (
        <div>
          <h3>Settings Content</h3>
          <p>Configure your preferences here.</p>
        </div>
      ),
    },
    {
      id: 'help',
      label: 'Help',
      content: (
        <div>
          <h3>Help Content</h3>
          <p>Get help and support information.</p>
        </div>
      ),
    },
  ]

  const handleTabChange = (tabId: string) => {
    console.log('Selected tab:', tabId)
  }

  return (
    <div className="p-8">
      <h2>Reusable Motion Tabs Example</h2>

      {/* Basic usage */}
      <MotionTabs tabs={tabs} onTabChange={handleTabChange} />

      {/* With custom styling */}
      <div className="mt-8">
        <h3>Custom Styled Tabs</h3>
        <MotionTabs
          tabs={tabs}
          className="bg-gray-900 border-2 border-gray-700"
          tabClassName="text-lg"
          contentClassName="bg-gray-800 text-white"
        />
      </div>

      {/* Tabs without content */}
      <div className="mt-8">
        <h3>Tabs Only (No Content)</h3>
        <MotionTabs
          tabs={tabs.map((tab) => ({ ...tab, content: undefined }))}
          showContent={false}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  )
}
