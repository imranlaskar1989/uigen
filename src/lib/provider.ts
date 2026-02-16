import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("pricing")) {
      componentType = "pricing";
      componentName = "PricingPage";
    } else if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "pricing":
        return `import { useState } from 'react';

const tiers = [
  {
    name: 'Basic',
    price: 9,
    description: 'Everything you need to get started',
    features: ['5 projects', '10GB storage', 'Basic analytics', 'Email support'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 29,
    description: 'Perfect for growing teams and businesses',
    features: ['Unlimited projects', '100GB storage', 'Advanced analytics', 'Priority support', 'Custom integrations', 'Team collaboration'],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 79,
    description: 'For organizations that need full control',
    features: ['Everything in Pro', 'Unlimited storage', 'SSO & SAML', 'Dedicated account manager', 'Custom SLA', '99.99% uptime'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const PricingPage = () => {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="py-16 sm:py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-violet-100 text-violet-700 mb-6">
            Simple Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Plans for every stage
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={\`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 \${!annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={\`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 \${annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
            >
              Annual
              <span className="ml-1.5 text-xs font-semibold text-emerald-600">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={\`relative rounded-2xl p-8 sm:p-10 transition-all duration-300 \${
                tier.highlighted
                  ? 'bg-slate-900 text-white ring-2 ring-violet-500 shadow-2xl shadow-violet-500/20 scale-[1.02]'
                  : 'bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-xl shadow-black/5 hover:shadow-2xl hover:-translate-y-1'
              }\`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className={\`text-lg font-bold mb-2 \${tier.highlighted ? 'text-white' : 'text-slate-900'}\`}>
                  {tier.name}
                </h3>
                <p className={\`text-sm \${tier.highlighted ? 'text-slate-300' : 'text-slate-500'}\`}>
                  {tier.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className={\`text-5xl font-extrabold tracking-tight \${tier.highlighted ? 'text-white' : 'text-slate-900'}\`}>
                    \${annual ? tier.price : Math.round(tier.price * 1.25)}
                  </span>
                  <span className={\`text-sm font-medium \${tier.highlighted ? 'text-slate-400' : 'text-slate-500'}\`}>
                    /month
                  </span>
                </div>
                {annual && (
                  <p className={\`text-xs mt-1 \${tier.highlighted ? 'text-slate-400' : 'text-slate-400'}\`}>
                    Billed annually
                  </p>
                )}
              </div>

              <button
                className={\`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 mb-8 \${
                  tier.highlighted
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0'
                    : 'ring-1 ring-slate-200 text-slate-700 hover:ring-violet-300 hover:bg-violet-50 hover:text-violet-700'
                }\`}
              >
                {tier.cta}
              </button>

              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg className={\`w-5 h-5 mt-0.5 flex-shrink-0 \${tier.highlighted ? 'text-violet-400' : 'text-emerald-500'}\`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className={\`text-sm \${tier.highlighted ? 'text-slate-300' : 'text-slate-600'}\`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;`;

      case "form":
        return `import { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">Message Sent</h2>
        <p className="text-slate-500 font-medium">We'll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-teal-100 text-teal-700 mb-4">
          Get in Touch
        </span>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Contact Us</h2>
        <p className="text-slate-500 font-medium">We'd love to hear from you. Send us a message.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-2 block">Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Your full name"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all duration-200 placeholder:text-slate-400" />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-2 block">Email</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all duration-200 placeholder:text-slate-400" />
        </div>
        <div>
          <label htmlFor="message" className="text-sm font-semibold text-slate-700 mb-2 block">Message</label>
          <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={4} placeholder="How can we help?"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all duration-200 placeholder:text-slate-400 resize-none" />
        </div>
        <button type="submit"
          className="w-full py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `const Card = ({
  title = "Welcome to Our Service",
  description = "Discover amazing features and capabilities that will transform your experience.",
  imageUrl,
  actions
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-xl shadow-black/5 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-full h-52 object-cover" />
      )}
      <div className="p-8">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-500 leading-relaxed mb-6">{description}</p>
        {actions && <div className="mt-2">{actions}</div>}
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center p-10 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-xl shadow-black/5">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-violet-100 text-violet-700 mb-6">
        Interactive Demo
      </span>
      <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Counter</h2>
      <p className="text-slate-500 font-medium mb-8">Tap to adjust the value</p>
      <div className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-10 tabular-nums">
        {count}
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => setCount(c => c - 1)}
          className="px-6 py-3 rounded-xl font-semibold ring-1 ring-slate-200 text-slate-700 hover:ring-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all duration-200"
        >
          Decrease
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-6 py-3 rounded-xl font-semibold ring-1 ring-slate-200 text-slate-500 hover:ring-slate-300 hover:bg-slate-50 transition-all duration-200"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          Increase
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "pricing":
        return "Simple Pricing";
      case "form":
        return "    console.log('Form submitted:', formData);";
      case "card":
        return '      <div className="p-8">';
      default:
        return "        Interactive Demo";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "pricing":
        return "Transparent Pricing";
      case "form":
        return "    console.log('Form submitted:', formData);\n    setSubmitted(true);";
      case "card":
        return '      <div className="p-8 sm:p-10">';
      default:
        return "        Interactive Counter";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <Card
          title="Craft Beautiful Interfaces"
          description="Build polished, production-ready components with modern design patterns. Every detail is intentional."
          actions={
            <button className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
              Get Started
            </button>
          }
        />
      </div>
    </div>
  );
}`;
    }

    if (componentName === "PricingPage") {
      return `import PricingPage from '@/components/PricingPage';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/50">
      <PricingPage />
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/50 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <${componentName} />
      </div>
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  return anthropic(MODEL);
}
