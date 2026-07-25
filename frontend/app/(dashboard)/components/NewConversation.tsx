"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function NewConversation() {
	const router = useRouter();

	const handleNewChat = () => {
		router.push('/dashboard');
		router.refresh();
	};

	return (
		<Button onClick={handleNewChat} className="w-full h-8.5 text-xs font-medium gap-1.5" size="sm">
			<Plus className="size-3.5" />
			New chat
		</Button>
	);
}
