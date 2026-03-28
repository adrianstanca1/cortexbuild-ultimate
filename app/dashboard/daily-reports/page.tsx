'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectItem } from '@/components/ui/Select';
import { DailyReportForm } from '@/components/forms/DailyReportForm';
import { Search, FileText, Sun, Cloud, CloudRain, CloudSnow, Users, MoreVertical } from 'lucide-react';

interface DailyReport {
  id: string;
  date: string;
  project: string;
  weather: string;
  weatherIcon: 'sun' | 'cloud' | 'rain' | 'snow';
  temperature: number;
  workforce: number;
  workPerformed: string;
  submittedBy: string;
}

const mockReports: DailyReport[] = [
  { id: '1', date: 'Mar 18, 2026', project: 'Metro Station', weather: 'Sunny', weatherIcon: 'sun', temperature: 18, workforce: 45, workPerformed: 'Completed concrete pour for Section A', submittedBy: 'John Smith' },
  { id: '2', date: 'Mar 17, 2026', project: 'Office Tower', weather: 'Cloudy', weatherIcon: 'cloud', temperature: 15, workforce: 32, workPerformed: 'Steel erection - Floor 8 complete', submittedBy: 'Sarah Connor' },
  { id: '3', date: 'Mar 16, 2026', project: 'Hospital Wing', weather: 'Rainy', weatherIcon: 'rain', temperature: 12, workforce: 18, workPerformed: 'Interior framing and MEP rough-in', submittedBy: 'Mike Ross' },
  { id: '4', date: 'Mar 15, 2026', project: 'Metro Station', weather: 'Sunny', weatherIcon: 'sun', temperature: 20, workforce: 42, workPerformed: 'Foundation prep and rebar installation', submittedBy: 'John Smith' },
  { id: '5', date: 'Mar 14, 2026', project: 'Office Tower', weather: 'Sunny', weatherIcon: 'sun', temperature: 22, workforce: 35, workPerformed: 'Curtain wall installation - Floors 5-7', submittedBy: 'Emily Chen' },
];

const weatherIcons = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
};

export default function DailyReportsPage() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedProject, setSelectedProject] = React.useState('');

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch = report.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.workPerformed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !selectedProject || report.project === selectedProject;
    return matchesSearch && matchesProject;
  });

  const uniqueProjects = [...new Set(mockReports.map((r) => r.project))];

  const stats = {
    totalReports: mockReports.length,
    thisMonth: mockReports.filter((r) => r.date.includes('Mar 2026')).length,
    totalWorkforce: mockReports.reduce((acc, r) => acc + r.workforce, 0),
    avgDailyWorkers: Math.round(mockReports.reduce((acc, r) => acc + r.workforce, 0) / mockReports.length),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Reports</h1>
          <p className="text-muted-foreground">Track daily progress and workforce</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + New Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.totalReports}</div>
            <div className="text-sm text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.totalWorkforce}</div>
            <div className="text-sm text-muted-foreground">Total Workforce Days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.avgDailyWorkers}</div>
            <div className="text-sm text-muted-foreground">Avg. Daily Workers</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject} className="w-48">
              <SelectItem value="">All Projects</SelectItem>
              {uniqueProjects.map((project) => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const WeatherIcon = weatherIcons[report.weatherIcon];
              return (
                <div key={report.id} className="p-6 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-medium">
                        {report.date}
                      </div>
                      <div className="font-semibold text-foreground">{report.project}</div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-2">
                      <WeatherIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Weather</div>
                        <div className="font-medium">{report.weather} {report.temperature}°C</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Workforce</div>
                        <div className="font-medium">{report.workforce} workers</div>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Submitted By</div>
                      <div className="font-medium">{report.submittedBy}</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Phase</div>
                      <Badge variant="info">In Progress</Badge>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Work Performed</div>
                    <div className="text-foreground">{report.workPerformed}</div>
                  </div>
                </div>
              );
            })}
            {filteredReports.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No reports found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showCreateModal && (
        <DailyReportForm
          projectId="1"
          onSubmit={(data) => {
            console.log('Create report:', data);
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}