const Card = ({ title, icon, children, actions, action, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-600">{icon}</span>}
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          {(actions || action) && <div className="flex items-center space-x-2">{actions || action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
