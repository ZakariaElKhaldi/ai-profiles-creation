import Todo from '../components/Todo';

export default function TodoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Task Management</h1>
        <p className="text-gray-600">Keep track of your tasks and stay organized</p>
      </div>
      
      <Todo />
    </div>
  );
} 