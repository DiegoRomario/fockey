import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Popup: React.FC = () => {
  const [homePageHidden, setHomePageHidden] = useState(true);
  const [shortsHidden, setShortsHidden] = useState(true);

  return (
    <div className="w-96 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Fockey</CardTitle>
          <CardDescription>Minimalist YouTube Experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="watch">Watch</TabsTrigger>
            </TabsList>
            <TabsContent value="home" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="home-feed">Hide Home Feed</Label>
                <Switch
                  id="home-feed"
                  checked={homePageHidden}
                  onCheckedChange={setHomePageHidden}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shorts">Hide Shorts</Label>
                <Switch id="shorts" checked={shortsHidden} onCheckedChange={setShortsHidden} />
              </div>
            </TabsContent>
            <TabsContent value="search" className="space-y-4">
              <p className="text-sm text-muted-foreground">Configure search page settings</p>
            </TabsContent>
            <TabsContent value="watch" className="space-y-4">
              <p className="text-sm text-muted-foreground">Configure watch page settings</p>
            </TabsContent>
          </Tabs>

          <Separator />

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced Settings</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Advanced customization options will appear here.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2">
            <Button variant="default" className="flex-1">
              Save Settings
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">About</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Fockey</DialogTitle>
                  <DialogDescription>
                    Fockey transforms YouTube into a minimalist, distraction-free experience. Hide
                    thumbnails, recommendations, and UI elements to stay focused on what matters.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Popup;
