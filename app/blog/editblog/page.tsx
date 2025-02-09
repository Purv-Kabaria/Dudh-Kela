"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";

const tags = ['beauty', 'lifestyle', 'homepage', 'fashion', 'health', 'food'];

const EditBlog = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [originalData, setOriginalData] = useState({
    title: '',
    author: '',
    readTime: '',
    description: '',
    imageUrl: '',
    tags: [] as string[],
    fullDescription: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    readTime: '',
    description: '',
    imageUrl: '',
    tags: [] as string[],
    fullDescription: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) {
        alert('Blog ID is missing');
        router.push('/blog');
        return;
      }

      try {
        const response = await fetch(`/api/blogs?id=${id}`);
        if (!response.ok) throw new Error('Failed to fetch blog');
        
        const data = await response.json();
        const initialData = {
          title: data.title || '',
          author: data.author || '',
          readTime: data.readTime || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          fullDescription: data.fullDescription || '',
        };
        setOriginalData(initialData);
        setFormData(initialData);
      } catch (error) {
        console.error('Fetch error:', error);
        alert('Failed to fetch blog details');
        router.push('/blog');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Only include fields that have been changed
      const changedFields = Object.entries(formData).reduce((acc, [key, value]) => {
        if (JSON.stringify(value) !== JSON.stringify(originalData[key as keyof typeof originalData])) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // If no fields were changed, return early
      if (Object.keys(changedFields).length === 0) {
        alert('No changes were made');
        return;
      }

      const response = await fetch(`/api/blogs?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changedFields),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update blog');
      }

      alert('Blog updated successfully!');
      router.push('/blog');
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 py-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Edit Blog Post
        </h1>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author
          </label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Read Time
          </label>
          <input
            type="text"
            name="readTime"
            value={formData.readTime}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Description
          </label>
          <textarea
            name="fullDescription"
            value={formData.fullDescription}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={8}
            placeholder="Enter full blog content (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${formData.tags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-500 text-white px-6 py-2 rounded-md
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          >
            {isSubmitting ? 'Updating...' : 'Update Blog Post'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/blog')}
            className="border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditBlog;