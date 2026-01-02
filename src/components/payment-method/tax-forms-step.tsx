export function TaxFormsStep({ data }: { data: { submittedDate: string } }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-4">
        <p className="text-gray-900">
          You submitted a W-9 form dated {data.submittedDate}.
        </p>

        <p className="text-gray-900">
          If you need to submit a new tax form,{" "}
          <a href="#" className="text-blue-600 underline">
            click here
          </a>
          .
        </p>

        <p className="text-gray-900">
          To view the W9 information you submitted{" "}
          <a href="#" className="text-blue-600 underline">
            click here
          </a>
          .
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mt-6">
        <p>
          These forms are provided solely for your convenience and are not intended to provide you with tax advice. You should consult with a qualified tax adviser or attorney to receive advice for your particular situation.
        </p>
      </div>
    </div>
  );
}
