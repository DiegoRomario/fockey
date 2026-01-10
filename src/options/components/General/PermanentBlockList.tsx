/**
 * Permanent Block List Component (24/7 Blocking)
 * Manages domains, URL keywords, and content keywords that are always blocked
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Globe, Link, FileText, X } from 'lucide-react';
import {
  getPermanentBlockList,
  addPermanentBlockDomain,
  removePermanentBlockDomain,
  addPermanentBlockUrlKeyword,
  removePermanentBlockUrlKeyword,
  addPermanentBlockContentKeyword,
  removePermanentBlockContentKeyword,
} from '@/shared/storage/settings-manager';
import { isValidDomainPattern } from '@/shared/utils/permanent-block-utils';
import { useToast } from '@/hooks/use-toast';
import { LockModeState } from '@/shared/types/settings';
import { cn } from '@/lib/utils';

interface PermanentBlockListProps {
  lockState: LockModeState | null;
}

export const PermanentBlockList: React.FC<PermanentBlockListProps> = ({ lockState }) => {
  const [domains, setDomains] = useState<string[]>([]);
  const [urlKeywords, setUrlKeywords] = useState<string[]>([]);
  const [contentKeywords, setContentKeywords] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [urlKeywordInput, setUrlKeywordInput] = useState('');
  const [contentKeywordInput, setContentKeywordInput] = useState('');
  const [domainInputError, setDomainInputError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const loadBlockList = async () => {
    try {
      const blockList = await getPermanentBlockList();
      setDomains(blockList.domains);
      setUrlKeywords(blockList.urlKeywords);
      setContentKeywords(blockList.contentKeywords);
    } catch (error) {
      console.error('Failed to load permanent block list:', error);
      toast({
        title: 'Error',
        description: 'Failed to load 24/7 block list',
        variant: 'destructive',
      });
    }
  };

  // Load block list on mount
  useEffect(() => {
    void loadBlockList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddDomain = async () => {
    const domain = domainInput.trim().toLowerCase();

    if (!domain) {
      setDomainInputError('Please enter a domain');
      return;
    }

    // Validate domain pattern
    if (!isValidDomainPattern(domain)) {
      setDomainInputError(
        'Please enter a valid domain (e.g., example.com or *.example.com for wildcards)'
      );
      return;
    }

    setDomainInputError(null);
    setIsAdding(true);

    try {
      await addPermanentBlockDomain(domain);
      await loadBlockList();
      setDomainInput('');
      toast({
        title: 'Domain Added',
        description: `${domain} will be blocked 24/7`,
      });
    } catch (error) {
      console.error('Failed to add domain:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add domain',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    if (lockState?.isLocked) {
      toast({
        title: 'Settings Locked',
        description: 'Cannot remove domains from 24/7 block list while Lock Mode is active',
        variant: 'destructive',
      });
      return;
    }

    try {
      await removePermanentBlockDomain(domain);
      await loadBlockList();
      toast({
        title: 'Domain Removed',
        description: `${domain} is no longer blocked`,
      });
    } catch (error) {
      console.error('Failed to remove domain:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove domain',
        variant: 'destructive',
      });
    }
  };

  const handleAddUrlKeyword = async () => {
    const keyword = urlKeywordInput.trim();

    if (!keyword) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a URL keyword',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      await addPermanentBlockUrlKeyword(keyword);
      await loadBlockList();
      setUrlKeywordInput('');
      toast({
        title: 'URL Keyword Added',
        description: `URLs containing "${keyword}" will be blocked 24/7`,
      });
    } catch (error) {
      console.error('Failed to add URL keyword:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add URL keyword',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUrlKeyword = async (keyword: string) => {
    if (lockState?.isLocked) {
      toast({
        title: 'Settings Locked',
        description: 'Cannot remove URL keywords from 24/7 block list while Lock Mode is active',
        variant: 'destructive',
      });
      return;
    }

    try {
      await removePermanentBlockUrlKeyword(keyword);
      await loadBlockList();
      toast({
        title: 'URL Keyword Removed',
        description: `"${keyword}" is no longer blocked`,
      });
    } catch (error) {
      console.error('Failed to remove URL keyword:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove URL keyword',
        variant: 'destructive',
      });
    }
  };

  const handleAddContentKeyword = async () => {
    const keyword = contentKeywordInput.trim();

    if (!keyword) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a content keyword',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      await addPermanentBlockContentKeyword(keyword);
      await loadBlockList();
      setContentKeywordInput('');
      toast({
        title: 'Content Keyword Added',
        description: `Pages with "${keyword}" will be blocked 24/7`,
      });
    } catch (error) {
      console.error('Failed to add content keyword:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add content keyword',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveContentKeyword = async (keyword: string) => {
    if (lockState?.isLocked) {
      toast({
        title: 'Settings Locked',
        description:
          'Cannot remove content keywords from 24/7 block list while Lock Mode is active',
        variant: 'destructive',
      });
      return;
    }

    try {
      await removePermanentBlockContentKeyword(keyword);
      await loadBlockList();
      toast({
        title: 'Content Keyword Removed',
        description: `"${keyword}" is no longer blocked`,
      });
    } catch (error) {
      console.error('Failed to remove content keyword:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove content keyword',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          24/7 Block List
        </CardTitle>
        <CardDescription>
          Always-on blocking regardless of schedules. Block by domain, URL patterns, or page
          content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="domains" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="url-keywords" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL Keywords
            </TabsTrigger>
            <TabsTrigger value="content-keywords" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content Keywords
            </TabsTrigger>
          </TabsList>

          {/* Domains Tab */}
          <TabsContent value="domains" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain-input">Add Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="domain-input"
                  type="text"
                  placeholder="example.com or *.example.com"
                  value={domainInput}
                  onChange={(e) => {
                    setDomainInput(e.target.value);
                    setDomainInputError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddDomain();
                  }}
                  disabled={isAdding}
                  className={cn('flex-1', domainInputError && 'border-destructive')}
                />
                <Button
                  onClick={handleAddDomain}
                  disabled={isAdding || !domainInput.trim()}
                  className="shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              {domainInputError && <p className="text-xs text-destructive">⚠ {domainInputError}</p>}
              {!domainInputError && (
                <p className="text-xs text-muted-foreground">
                  Examples: reddit.com, twitter.com, *.facebook.com (wildcards supported)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Blocked Domains ({domains.length})</Label>
              {domains.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No blocked domains yet</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {domains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        disabled={lockState?.isLocked}
                        className="rounded-full p-0.5 hover:bg-muted-foreground/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* URL Keywords Tab */}
          <TabsContent value="url-keywords" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-keyword-input">Add URL Keyword</Label>
              <div className="flex gap-2">
                <Input
                  id="url-keyword-input"
                  type="text"
                  placeholder="watch?v= or /shorts/ or playlist"
                  value={urlKeywordInput}
                  onChange={(e) => setUrlKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddUrlKeyword();
                  }}
                  disabled={isAdding}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddUrlKeyword}
                  disabled={isAdding || !urlKeywordInput.trim()}
                  className="shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Block any URL containing this keyword (case-insensitive)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Blocked URL Keywords ({urlKeywords.length})</Label>
              {urlKeywords.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No blocked URL keywords yet</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {urlKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveUrlKeyword(keyword)}
                        disabled={lockState?.isLocked}
                        className="rounded-full p-0.5 hover:bg-muted-foreground/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Content Keywords Tab */}
          <TabsContent value="content-keywords" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-keyword-input">Add Content Keyword</Label>
              <div className="flex gap-2">
                <Input
                  id="content-keyword-input"
                  type="text"
                  placeholder="trending or celebrity or gossip"
                  value={contentKeywordInput}
                  onChange={(e) => setContentKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddContentKeyword();
                  }}
                  disabled={isAdding}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddContentKeyword}
                  disabled={isAdding || !contentKeywordInput.trim()}
                  className="shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Block pages containing this keyword in titles, headings, or text
              </p>
            </div>

            <div className="space-y-2">
              <Label>Blocked Content Keywords ({contentKeywords.length})</Label>
              {contentKeywords.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No blocked content keywords yet</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {contentKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveContentKeyword(keyword)}
                        disabled={lockState?.isLocked}
                        className="rounded-full p-0.5 hover:bg-muted-foreground/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {lockState?.isLocked && (
          <p className="text-xs text-amber-600">
            Lock Mode is active. You can add items but cannot remove them until the lock expires.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
