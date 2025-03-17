import { useState, useEffect } from 'react';

interface TodoItem {
  id: number;
  text: string;
  category: 'profile' | 'prompt' | 'testing' | 'documentation' | 'other';
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

// Predefined task categories
const CATEGORIES = [
  { id: 'profile', label: 'Profile Creation', color: 'bg-blue-600' },
  { id: 'prompt', label: 'Prompt Engineering', color: 'bg-purple-600' },
  { id: 'testing', label: 'Testing & QA', color: 'bg-green-600' },
  { id: 'documentation', label: 'Documentation', color: 'bg-yellow-600' },
  { id: 'other', label: 'Other', color: 'bg-gray-600' }
] as const;

// Predefined priority levels
const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-blue-600' },
  { id: 'medium', label: 'Medium', color: 'bg-yellow-600' },
  { id: 'high', label: 'High', color: 'bg-red-600' }
] as const;

// Example pre-filled tasks
const EXAMPLE_TASKS: TodoItem[] = [
  {
    id: 1,
    text: "Create a new professional assistant profile",
    category: "profile",
    completed: false,
    dueDate: "2023-08-30",
    priority: "high"
  },
  {
    id: 2,
    text: "Optimize prompts for the customer service bot",
    category: "prompt",
    completed: false,
    dueDate: "2023-08-25",
    priority: "medium"
  },
  {
    id: 3,
    text: "Test response quality across different models",
    category: "testing",
    completed: false,
    dueDate: "2023-08-28",
    priority: "medium"
  },
  {
    id: 4,
    text: "Document the process for creating effective chatbot profiles",
    category: "documentation",
    completed: true,
    dueDate: "2023-08-15",
    priority: "low"
  }
];

export default function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<TodoItem['category']>('profile');
  const [priority, setPriority] = useState<TodoItem['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TodoItem['category'] | 'all'>('all');

  // Load example tasks on first render
  useEffect(() => {
    const savedTodos = localStorage.getItem('chatbot-todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    } else {
      setTodos(EXAMPLE_TASKS);
    }
  }, []);

  // Save todos to localStorage when they change
  useEffect(() => {
    localStorage.setItem('chatbot-todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (input.trim() === '') return;
    
    const newTodo: TodoItem = {
      id: Date.now(),
      text: input,
      category,
      completed: false,
      dueDate: dueDate || undefined,
      priority
    };
    
    setTodos([...todos, newTodo]);
    setInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Filter todos based on current filter state
  const filteredTodos = todos.filter(todo => {
    // First filter by completion status
    if (filter === 'completed' && !todo.completed) return false;
    if (filter === 'active' && todo.completed) return false;
    
    // Then filter by category if a specific one is selected
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;
    
    return true;
  });

  // Sort by priority and then by due date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // First sort by completion (completed items go to the bottom)
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // Then sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // Then sort by due date if both have one
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    // Put items with due dates before those without
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    return 0;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Chatbot Development Task</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Task Description</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a task description..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TodoItem['category'])}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoItem['priority'])}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES.map(pri => (
                  <option key={pri.id} value={pri.id}>{pri.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className={`w-full py-2 rounded-lg font-medium ${
              !input.trim() 
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Add Task
          </button>
        </div>
      </div>
      
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Chatbot Development Tasks</h2>
          
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
              className="px-3 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="space-y-3">
          {sortedTodos.length === 0 ? (
            <p className="text-center py-6 text-zinc-400">
              {filter === 'all'
                ? 'No tasks yet. Add one above!'
                : filter === 'active'
                  ? 'No active tasks.'
                  : 'No completed tasks.'}
            </p>
          ) : (
            sortedTodos.map(todo => {
              const categoryObj = CATEGORIES.find(c => c.id === todo.category);
              const priorityObj = PRIORITIES.find(p => p.id === todo.priority);
              
              return (
                <div 
                  key={todo.id} 
                  className={`p-4 border rounded-lg transition-colors ${
                    todo.completed 
                      ? 'border-zinc-700 bg-zinc-800 bg-opacity-30' 
                      : 'border-zinc-700 bg-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        className="mt-1 h-5 w-5 rounded border-zinc-600 text-blue-600 focus:ring-blue-600"
                      />
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-1">
                          <span 
                            className={`px-2 py-0.5 text-xs rounded-full ${categoryObj?.color} text-white`}
                          >
                            {categoryObj?.label || todo.category}
                          </span>
                          
                          <span 
                            className={`px-2 py-0.5 text-xs rounded-full ${priorityObj?.color} text-white`}
                          >
                            {priorityObj?.label} Priority
                          </span>
                          
                          {todo.dueDate && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-700 text-white">
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        <p className={`${todo.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                          {todo.text}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-zinc-400 hover:text-red-500 ml-2 p-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 