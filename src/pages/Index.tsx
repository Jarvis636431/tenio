import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 自动重定向到新建项目页面
    navigate("/new-project");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">天友智管平台</h1>
        <p className="text-xl text-muted-foreground">正在加载...</p>
      </div>
    </div>
  );
};

export default Index;
