import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellRing, UserPlus, UploadCloud, DollarSign } from "lucide-react";

export function Notifications() {
  // Toggle this to test empty state
  const [hasNotifications] = useState(true);

  const mockNotifications = [
    { id: 1, title: "Expense Added", desc: "Rahul added 'Dinner at Olive' in Goa Trip.", time: "10 mins ago", icon: <DollarSign size={20} className="text-primary" /> },
    { id: 2, title: "Settlement Added", desc: "Priya settled ₹500 in Roommates.", time: "2 hours ago", icon: <BellRing size={20} className="text-green-500" /> },
    { id: 3, title: "Member Added", desc: "You were added to 'Office Lunch'.", time: "Yesterday", icon: <UserPlus size={20} className="text-blue-500" /> },
    { id: 4, title: "Import Completed", desc: "Your historical data was successfully imported.", time: "2 days ago", icon: <UploadCloud size={20} className="text-purple-500" /> },
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Stay updated on your group activities.</p>
      </div>

      {!hasNotifications ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
            <Bell size={40} className="text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Notifications</h2>
          <p className="text-muted-foreground max-w-sm">
            You're all caught up! When something happens in your groups, you'll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {mockNotifications.map((note) => (
            <Card key={note.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center shrink-0">
                  {note.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{note.title}</h3>
                    <span className="text-xs text-muted-foreground">{note.time}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{note.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
