import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye, Heart, Share2, Calendar, Users } from "lucide-react";

interface AnalyticsDashboardProps {
  userId: number;
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const { data: myProperties = [] } = useQuery({
    queryKey: ["/api/my-properties"],
  });

  const { data: colistingRequests = [] } = useQuery({
    queryKey: ["/api/colisting-requests"],
  });

  // Calculate analytics
  const totalListings = myProperties.length;
  const exclusiveListings = myProperties.filter((p: any) => p.listingType === "exclusive").length;
  const coListings = myProperties.filter((p: any) => p.listingType === "colisting").length;
  const pendingRequests = colistingRequests.filter((r: any) => r.status === "pending").length;

  // Mock analytics data for premium features
  const totalViews = myProperties.reduce((acc: number, p: any) => acc + Math.floor(Math.random() * 100) + 50, 0);
  const totalLikes = Math.floor(totalViews * 0.2);
  const totalShares = Math.floor(totalViews * 0.1);

  const recentActivity = [
    { action: "New property view", property: "2BHK in Bandra", time: "2 hours ago" },
    { action: "Co-listing request", property: "Villa in Juhu", time: "5 hours ago" },
    { action: "Property shared", property: "Commercial Space", time: "1 day ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{totalListings}</div>
                <div className="text-xs text-neutral-500">Active Listings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Eye size={16} className="text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{totalViews}</div>
                <div className="text-xs text-neutral-500">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <Heart size={16} className="text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{totalLikes}</div>
                <div className="text-xs text-neutral-500">Likes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Share2 size={16} className="text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{totalShares}</div>
                <div className="text-xs text-neutral-500">Shares</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listing Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600">Exclusive Listings</span>
            <span className="font-medium">{exclusiveListings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600">Co-listings Allowed</span>
            <span className="font-medium">{coListings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-600">Pending Co-list Requests</span>
            <span className="font-medium text-orange-600">{pendingRequests}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-900">{activity.action}</div>
                  <div className="text-xs text-neutral-500">{activity.property}</div>
                  <div className="text-xs text-neutral-400">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}