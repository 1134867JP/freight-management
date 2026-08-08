import React from 'react';
import Pagination from '@/Components/UI/Pagination';

export default function TimeslotsPagination({ links }) {
  return <Pagination links={links} className="border-t border-gray-100 pt-4 dark:border-gray-700" />;
}
