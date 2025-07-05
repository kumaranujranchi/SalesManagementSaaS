#!/bin/bash
sed -i -e 's/user.name}$/user.fullName || `User ${user.id}`}/g' client/src/pages/sales-management-page.tsx
