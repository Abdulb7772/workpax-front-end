"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { useRouter } from "next/navigation";
import type { Task } from "@/types/task";

export default function YourWorkPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([
        axiosInstance.get("/api/projects"),
        axiosInstance.get("/api/tasks"),
      ]);
      setProjects(projectsRes.data.data || []);
      setTasks(tasksRes.data.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getTasksByStatus = (status: string) =>
    tasks.filter((task) => task.status === status);

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Your Work</h1>
      {loading ? (
        <div className="text-lg text-gray-600">Loading...</div>
      ) : (
        <div className="space-y-10">
          {/* All Projects */}
          <section>
            <div className="rounded-xl shadow-lg p-6 border-l-8 border-blue-400 bg-white/80 hover:shadow-2xl transition-shadow">
              <h2 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-blue-400 rounded-full"></span>
                All Projects
              </h2>
              <ul className="list-disc ml-8">
                {projects.map((project) => (
                  <li
                    key={project._id}
                    className="cursor-pointer hover:underline text-blue-700 hover:text-blue-900 font-medium"
                    onClick={() => router.push(`/protected/projects/${project._id}`)}
                  >
                    {project.name}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Completed Tasks */}
          <section>
            <div className="rounded-xl shadow-lg p-6 border-l-8 border-green-400 bg-white/80 hover:shadow-2xl transition-shadow">
              <h2 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-400 rounded-full"></span>
                Completed Tasks
              </h2>
              {getTasksByStatus("completed").length > 0 ? (
                <ul className="list-disc ml-8">
                  {getTasksByStatus("completed").map((task) => (
                    <li key={task._id} className="text-green-700 font-medium">{task.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No completed tasks.</p>
              )}
            </div>
          </section>

          {/* In Progress Tasks */}
          <section>
            <div className="rounded-xl shadow-lg p-6 border-l-8 border-yellow-400 bg-white/80 hover:shadow-2xl transition-shadow">
              <h2 className="text-xl font-bold mb-4 text-yellow-700 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full"></span>
                In Progress Tasks
              </h2>
              {getTasksByStatus("in-progress").length > 0 ? (
                <ul className="list-disc ml-8">
                  {getTasksByStatus("in-progress").map((task) => (
                    <li key={task._id} className="text-yellow-700 font-medium">{task.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No in-progress tasks.</p>
              )}
            </div>
          </section>

          {/* Newly Assigned Tasks */}
          <section>
            <div className="rounded-xl shadow-lg p-6 border-l-8 border-purple-400 bg-white/80 hover:shadow-2xl transition-shadow">
              <h2 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-purple-400 rounded-full"></span>
                Newly Assigned Tasks
              </h2>
              {getTasksByStatus("todo").length > 0 ? (
                <ul className="list-disc ml-8">
                  {getTasksByStatus("todo").map((task) => (
                    <li key={task._id} className="text-purple-700 font-medium">{task.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No newly assigned tasks.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
