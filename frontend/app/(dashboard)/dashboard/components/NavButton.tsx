import { Button } from '@/components/ui/button';
import Link from 'next/link';

const NavButton = ({
  icon,
  link,
  text,
  ...props
}: {
  icon: React.ReactNode;
  link: string;
  text: string;
} & React.ComponentProps<typeof Button>) => {
  return (
    <Link href={link}>
      <Button className="w-full" size="lg" {...props}>
        {icon}
        {text}
      </Button>
    </Link>
  );
};

export default NavButton;
