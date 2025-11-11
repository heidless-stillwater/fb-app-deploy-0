import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CheckCircle2 } from 'lucide-react';

const tiers = [
  {
    name: 'Hobby',
    price: '$0',
    priceSuffix: '/ month',
    description: 'For personal projects and experiments.',
    features: [
      '500 MB Storage',
      '1 User',
      'Basic AI Features',
      'Community Support',
    ],
    cta: 'Get Started for Free',
    isPrimary: false,
  },
  {
    name: 'Pro',
    price: '$20',
    priceSuffix: '/ month',
    description: 'For professionals and small teams who need more power.',
    features: [
      '20 GB Storage',
      '5 Users',
      'Advanced AI Features',
      'Priority Email Support',
      'Folder Sharing',
    ],
    cta: 'Upgrade to Pro',
    isPrimary: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceSuffix: '',
    description: 'For large organizations with custom needs.',
    features: [
      'Unlimited Storage',
      'Unlimited Users',
      'Dedicated AI Models',
      '24/7 Phone Support',
      'Single Sign-On (SSO)',
    ],
    cta: 'Contact Sales',
    isPrimary: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto max-w-5xl px-4 py-8">
        <div className="absolute top-4 left-4">
            <Button asChild variant="ghost">
            <Link href="/">&larr; Back to Home</Link>
            </Button>
        </div>
        <div className="text-center mt-16">
          <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
            Find the perfect plan
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start for free, then scale up as you grow.
          </p>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col ${tier.isPrimary ? 'border-primary ring-2 ring-primary shadow-2xl' : 'shadow-sm'}`}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <div className="mb-8 text-center">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  {tier.priceSuffix && <span className="text-muted-foreground">{tier.priceSuffix}</span>}
                </div>
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={tier.isPrimary ? 'default' : 'outline'}>
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      <footer className="container mx-auto max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} File Storage. All rights reserved.</p>
      </footer>
    </div>
  );
}
