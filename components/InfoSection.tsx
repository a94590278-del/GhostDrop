import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

const infoContent = [
  {
    id: 'what-is',
    title: 'What is a disposable temporary email?',
    content: (
      <p>
        A disposable email is a temporary and anonymous email address that you can use to receive emails without revealing your primary email. GhostDrop provides you with an email address that exists just long enough to receive a verification email, a confirmation link, or any other temporary message. It's a powerful tool for privacy and security.
      </p>
    ),
  },
  {
    id: 'tech-behind',
    title: 'The tech behind disposable email addresses',
    content: (
      <p>
        GhostDrop operates by generating a unique, random email address tied to our domain. When an email is sent to this address, our servers capture it and display it instantly in the web interface you see above. There's no need to register or remember a password. The mailbox is created on-demand and is accessible only during your current session.
      </p>
    ),
  },
  {
    id: 'why-need',
    title: 'Why would you need a fake email address?',
    content: (
      <>
        <p>There are many reasons to use a temporary email address:</p>
        <ul className="list-disc list-inside pl-4 space-y-1">
          <li><strong>Avoid Spam:</strong> Sign up for newsletters or services without worrying about your main inbox getting cluttered with promotional emails.</li>
          <li><strong>Protect Privacy:</strong> Keep your personal email address private when dealing with untrusted websites or forums.</li>
          <li><strong>Testing & Development:</strong> Developers can use temporary emails to test sign-up flows and email functionalities in their applications.</li>
          <li><strong>One-Time Registrations:</strong> Use it for services that require email verification for a single use, like downloading a file or accessing content.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-to-use',
    title: 'How to use a disposable email address?',
    content: (
      <>
        <p>Using GhostDrop is incredibly simple:</p>
        <ol className="list-decimal list-inside pl-4 space-y-1">
          <li>An email address is automatically generated for you on this page.</li>
          <li>Click the copy button to copy the address to your clipboard.</li>
          <li>Paste it into any website or form that requires an email address.</li>
          <li>Return to this page. Your incoming emails will appear in the inbox section in real-time.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'to-conclude',
    title: 'To conclude',
    content: (
      <p>
        Using a disposable email service like GhostDrop is a smart and easy way to protect your online identity. It provides a buffer between your personal information and the internet, ensuring your primary inbox stays clean and secure. Enjoy the peace of mind that comes with enhanced privacy.
      </p>
    ),
  },
];

const AccordionItem = ({ id, title, children, isOpen, onToggle }: { id: string, title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) => {
  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-cyan-500/20 rounded-lg shadow-lg dark:shadow-cyan-500/5 transition-colors overflow-hidden">
      <h3 className="text-xl font-bold">
        <button
          id={`accordion-button-${id}`}
          aria-controls={`accordion-panel-${id}`}
          onClick={onToggle}
          className="w-full flex justify-between items-center p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white/70 dark:focus-visible:ring-offset-gray-900/70 rounded-lg"
          aria-expanded={isOpen}
        >
          <span className="text-blue-600 dark:text-cyan-400">{title}</span>
          <ChevronDownIcon className={`h-6 w-6 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      <div
        id={`accordion-panel-${id}`}
        role="region"
        aria-labelledby={`accordion-button-${id}`}
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="text-gray-600 dark:text-gray-400 space-y-2 text-base leading-relaxed px-6 pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function InfoSection() {
    const [openItemId, setOpenItemId] = useState<string | null>(infoContent[0].id);

    const handleToggle = (id: string) => {
        setOpenItemId(prevId => (prevId === id ? null : id));
    };

    return (
        <section className="relative z-10 mt-12 w-full">
            <div className="space-y-4">
                {infoContent.map((item) => (
                    <AccordionItem
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        isOpen={openItemId === item.id}
                        onToggle={() => handleToggle(item.id)}
                    >
                        {item.content}
                    </AccordionItem>
                ))}
            </div>
        </section>
    );
}