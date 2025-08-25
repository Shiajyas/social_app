import { CheckCircleIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface Props {
  name: string;
  price: string;
  description?: string;
  features?: string[];
  isSelected?: boolean;
  onSelect?: () => void;
}

const SubscriptionPlanPreview: React.FC<Props> = ({
  name,
  price,
  description,
  features,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className={clsx(
        'border rounded-xl p-6 shadow-sm cursor-pointer transition',
        isSelected
          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        'hover:shadow-lg'
      )}
    >
      <div className="flex items-center gap-2">
        <CheckCircleIcon
          className={clsx(
            'h-6 w-6',
            isSelected ? 'text-purple-600' : 'text-gray-400'
          )}
        />
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{name}</h4>
      </div>

      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2">{price}</p>

      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>
      )}

      {features && features.length > 0 && (
        <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
          {features.map((f, idx) => (
            <li key={idx} className="flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubscriptionPlanPreview;
